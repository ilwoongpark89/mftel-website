"use client";

import { createContext } from "react";
import { DEFAULT_MEMBERS } from "./constants";

export const MembersContext = createContext<Record<string, { team: string; role: string; emoji: string }>>(DEFAULT_MEMBERS);
export const ConfirmDeleteContext = createContext<(action: () => void) => void>(() => {});
export const SavingContext = createContext<Set<number>>(new Set());
