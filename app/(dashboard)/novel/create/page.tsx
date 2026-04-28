"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createNovel } from "@/lib/actions/novel-actions";

const GENRES = [
  "Romansa",
  "Horror",
  "Misteri",
  "Petualangan",
  "Remaja",
  "Komedi",
  "Thriller",
  "Fiksi Ilmiah",
  "Religi",
  "Fiksi Sejarah",
  "Fantasi",
];

interface CharacterItem {
  name: string;
  description: string;
}

interface SettingItem {
  name: string;
  description: string;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    filter: "blur(2px)",
    transition: { duration: 0.15, ease: "easeIn" as const },
  }),
};

export default function CreateNovelPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [title, setTitle] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [premise, setPremise] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [settings, setSettings] = useState<SettingItem[]>([]);

  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [settingDialogOpen, setSettingDialogOpen] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [settingName, setSettingName] = useState("");
  const [settingDescription, setSettingDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 7;

  const toggleGenre = (genre: string) => {
    setGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return title.trim().length > 0;
      case 2:
        return genres.length > 0;
      case 3:
        return premise.trim().length > 0;
      case 4:
        return synopsis.trim().length > 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!canProceed()) {
      toast.error("Lengkapi data terlebih dahulu");
      return;
    }
    if (step < totalSteps) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const openCharacterDialog = () => {
    setCharacterName("");
    setCharacterDescription("");
    setCharacterDialogOpen(true);
  };

  const saveCharacter = useCallback(() => {
    if (!characterName.trim()) {
      toast.error("Nama karakter tidak boleh kosong");
      return;
    }
    setCharacters((prev) => [
      ...prev,
      { name: characterName.trim(), description: characterDescription.trim() },
    ]);
    setCharacterDialogOpen(false);
  }, [characterName, characterDescription]);

  const removeCharacter = (index: number) => {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  };

  const openSettingDialog = () => {
    setSettingName("");
    setSettingDescription("");
    setSettingDialogOpen(true);
  };

  const saveSetting = useCallback(() => {
    if (!settingName.trim()) {
      toast.error("Nama latar tidak boleh kosong");
      return;
    }
    setSettings((prev) => [
      ...prev,
      { name: settingName.trim(), description: settingDescription.trim() },
    ]);
    setSettingDialogOpen(false);
  }, [settingName, settingDescription]);

  const removeSetting = (index: number) => {
    setSettings((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canProceed()) {
      toast.error("Lengkapi data terlebih dahulu");
      return;
    }
    setIsSubmitting(true);
    try {
      await createNovel({
        title: title.trim(),
        premise: premise.trim(),
        synopsis: synopsis.trim(),
        genres,
        characters: characters.length > 0 ? characters : undefined,
        settings: settings.length > 0 ? settings : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal membuat novel";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Apa Judulnya?
            </h2>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tulis judul novelmu..."
              className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-lg md:text-xl text-center px-0 focus-visible:ring-0 focus-visible:border-black transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && canProceed()) nextStep();
              }}
            />
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Pilih Genrenya
            </h2>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {GENRES.map((genre) => {
                const selected = genres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.96] ${
                      selected
                        ? "bg-black text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Tulis Premisnya
            </h2>
            <Textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="Tulis premis novelmu..."
              className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-base md:text-lg text-center px-0 min-h-[100px] md:min-h-[120px] resize-none focus-visible:ring-0 focus-visible:border-black transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) return;
                if (e.key === "Enter" && canProceed()) nextStep();
              }}
            />
            <p className="text-xs text-gray-400 mt-2">Tekan Enter untuk lanjut</p>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Tulis Sinopsisnya
            </h2>
            <Textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Tulis sinopsis novelmu..."
              className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent text-base md:text-lg text-center px-0 min-h-[100px] md:min-h-[120px] resize-none focus-visible:ring-0 focus-visible:border-black transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.shiftKey) return;
                if (e.key === "Enter" && canProceed()) nextStep();
              }}
            />
            <p className="text-xs text-gray-400 mt-2">Tekan Enter untuk lanjut</p>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Tambah Karakter
            </h2>
            <p className="text-xs text-gray-400 mb-4">Opsional — bisa dilewati</p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6">
              {characters.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-xs md:text-sm"
                >
                  {c.name}
                  <button
                    onClick={() => removeCharacter(i)}
                    className="rounded-full hover:bg-gray-200 p-0.5 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={openCharacterDialog}
                className="inline-flex items-center gap-1 rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-black bg-white text-xs md:text-sm font-medium hover:bg-gray-50 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            <Dialog
              open={characterDialogOpen}
              onOpenChange={setCharacterDialogOpen}
            >
              <DialogContent className="sm:rounded-lg p-5 md:p-6 max-w-[90vw] md:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg font-semibold">
                    Tambah Karakter
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nama Karakter
                    </label>
                    <Input
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      placeholder="Nama karakter..."
                      className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-black transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveCharacter();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Deskripsi Karakter
                    </label>
                    <Textarea
                      value={characterDescription}
                      onChange={(e) =>
                        setCharacterDescription(e.target.value)
                      }
                      placeholder="Deskripsi karakter..."
                      className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent px-0 min-h-[80px] resize-none focus-visible:ring-0 focus-visible:border-black transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveCharacter();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={saveCharacter}
                    className="w-full bg-black text-white hover:bg-black/90 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                  >
                    Simpan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col items-center w-full max-w-xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Tambah Latar
            </h2>
            <p className="text-xs text-gray-400 mb-4">Opsional — bisa dilewati</p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6">
              {settings.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-xs md:text-sm"
                >
                  {s.name}
                  <button
                    onClick={() => removeSetting(i)}
                    className="rounded-full hover:bg-gray-200 p-0.5 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={openSettingDialog}
                className="inline-flex items-center gap-1 rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-black bg-white text-xs md:text-sm font-medium hover:bg-gray-50 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>

            <Dialog
              open={settingDialogOpen}
              onOpenChange={setSettingDialogOpen}
            >
              <DialogContent className="sm:rounded-lg p-5 md:p-6 max-w-[90vw] md:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg font-semibold">
                    Tambah Latar
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nama Latar
                    </label>
                    <Input
                      value={settingName}
                      onChange={(e) => setSettingName(e.target.value)}
                      placeholder="Nama latar..."
                      className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent px-0 focus-visible:ring-0 focus-visible:border-black transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveSetting();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Deskripsi Latar
                    </label>
                    <Textarea
                      value={settingDescription}
                      onChange={(e) =>
                        setSettingDescription(e.target.value)
                      }
                      placeholder="Deskripsi latar..."
                      className="border-0 border-b-2 border-gray-200 rounded-none bg-transparent px-0 min-h-[80px] resize-none focus-visible:ring-0 focus-visible:border-black transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          saveSetting();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={saveSetting}
                    className="w-full bg-black text-white hover:bg-black/90 transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
                  >
                    Simpan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      case 7:
        return (
          <div className="flex flex-col items-center w-full max-w-lg mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8">
              Siap Dibuat?
            </h2>
            <div className="w-full space-y-3 text-sm mb-8">
              {[
                { label: "Judul", value: title },
                { label: "Genre", value: genres.join(", ") },
                { label: "Premis", value: premise },
                { label: "Sinopsis", value: synopsis },
                {
                  label: "Karakter",
                  value:
                    characters.length > 0
                      ? characters.map((c) => c.name).join(", ")
                      : "-",
                },
                {
                  label: "Latar",
                  value:
                    settings.length > 0
                      ? settings.map((s) => s.name).join(", ")
                      : "-",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-100 pb-2 gap-0.5 sm:gap-4"
                >
                  <span className="text-gray-500 text-xs sm:text-sm shrink-0">
                    {label}
                  </span>
                  <span className="font-medium text-xs sm:text-sm text-left sm:text-right sm:max-w-[60%] break-words">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full max-w-md bg-black text-white hover:bg-black/90 h-11 md:h-12 text-sm md:text-base font-medium transition-[background-color,scale] duration-150 ease-out active:scale-[0.96]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Buat Novel"
              )}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center py-6 md:py-8">
      {/* Header */}
      <div className="text-center mb-4">
        <p className="text-xs md:text-sm font-medium text-gray-400">
          Langkah {step} dari {totalSteps}
        </p>
      </div>

      {/* Step Content */}
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-lg mx-auto mt-6 md:mt-8 flex items-center justify-between px-4 md:px-6">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className={`inline-flex items-center gap-1 text-sm font-medium transition-[opacity,scale] duration-150 ease-out ${
            step === 1 ? "opacity-0 pointer-events-none" : "opacity-100 hover:opacity-70 active:scale-[0.96]"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? "w-6 h-2 bg-black"
                  : i + 1 < step
                  ? "w-2 h-2 bg-black/50"
                  : "w-2 h-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step < totalSteps ? (
          <button
            onClick={nextStep}
            className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-[opacity,scale] duration-150 ease-out active:scale-[0.96]"
          >
            Lanjut
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>
    </div>
  );
}
