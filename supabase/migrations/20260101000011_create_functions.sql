-- Cascade delete on account deletion: clean up domain data before auth.users delete
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Verify the requesting user is deleting their own account
  IF p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Cannot delete another user account';
  END IF;

  -- Delete all novels (cascade handles chapters, snapshots, embeddings, stale flags, jobs)
  DELETE FROM public.novels WHERE user_id = p_user_id;

  -- Delete profile
  DELETE FROM public.profiles WHERE id = p_user_id;
END;
$$;

-- Flag downstream chapters as stale after upstream changes
CREATE OR REPLACE FUNCTION public.flag_downstream_chapters(
  p_chapter_id UUID,
  p_reason stale_reason
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_novel_id UUID;
  v_sequence INT;
  v_count INT := 0;
BEGIN
  -- Get the chapter's novel and sequence
  SELECT novel_id, sequence_number INTO v_novel_id, v_sequence
  FROM chapters WHERE id = p_chapter_id;

  -- Flag all later COMPLETED chapters as stale
  INSERT INTO stale_chapter_flags (chapter_id, caused_by_chapter_id, reason)
  SELECT c.id, p_chapter_id, p_reason
  FROM chapters c
  WHERE c.novel_id = v_novel_id
    AND c.sequence_number > v_sequence
    AND c.status = 'COMPLETED'
  ON CONFLICT (chapter_id, caused_by_chapter_id, reason) DO UPDATE
    SET dismissed_at = NULL, updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Validate chapter status transitions
CREATE OR REPLACE FUNCTION public.validate_chapter_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cannot transition from COMPLETED back to DRAFT or OUTLINED
  -- unless chapter_text is being cleared (full regeneration)
  IF OLD.status = 'COMPLETED' AND NEW.status IN ('DRAFT', 'OUTLINED') THEN
    IF NEW.chapter_text != '' AND NEW.chapter_text IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot transition COMPLETED chapter to % without clearing chapter_text', NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_chapter_transition BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION public.validate_chapter_transition();
