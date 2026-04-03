"use client";
// ─────────────────────────────────────────────
// XCSM V3 — Context Global Agent IA
// ─────────────────────────────────────────────

import React, { createContext, useCallback, useContext, useReducer } from "react";
import { streamAIResponse } from "@/services/aiService";
import type { AIAgentState, ChatMessage, GranuleContext } from "@/types/ai.types";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ── État initial ─────────────────────────────
const INITIAL_STATE: AIAgentState = {
  isOpen: false,
  isLoading: false,
  messages: [],
  context: null,
  error: null,
};

// ── Actions ──────────────────────────────────
type Action =
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SET_CONTEXT"; payload: GranuleContext }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "STREAM_DELTA"; payload: string }
  | { type: "FINISH_STREAMING" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR" };

function reducer(state: AIAgentState, action: Action): AIAgentState {
  switch (action.type) {
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "SET_CONTEXT":
      return { ...state, context: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "STREAM_DELTA": {
      const msgs = [...state.messages];
      const last = msgs.at(-1);
      if (last?.isStreaming) {
        msgs[msgs.length - 1] = { ...last, content: last.content + action.payload };
      }
      return { ...state, messages: msgs };
    }
    case "FINISH_STREAMING": {
      const msgs = [...state.messages];
      const last = msgs.at(-1);
      if (last) msgs[msgs.length - 1] = { ...last, isStreaming: false };
      return { ...state, messages: msgs, isLoading: false };
    }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "CLEAR":
      return { ...state, messages: [], error: null };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────
interface ContextValue {
  state: AIAgentState;
  openAgent: () => void;
  closeAgent: () => void;
  setContext: (ctx: GranuleContext) => void;
  sendMessage: (msg: string) => Promise<void>;
  clearMessages: () => void;
}

const AIAgentContext = createContext<ContextValue | null>(null);

// ── Provider ─────────────────────────────────
export function AIAgentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const openAgent    = useCallback(() => dispatch({ type: "OPEN" }), []);
  const closeAgent   = useCallback(() => dispatch({ type: "CLOSE" }), []);
  const clearMessages = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const setContext   = useCallback((ctx: GranuleContext) =>
    dispatch({ type: "SET_CONTEXT", payload: ctx }), []);

  const sendMessage = useCallback(async (msg: string) => {
    if (!msg.trim() || state.isLoading) return;

    dispatch({ type: "SET_ERROR", payload: null });

    // 1. Message utilisateur
    dispatch({
      type: "ADD_MESSAGE",
      payload: { id: uid(), role: "user", content: msg.trim(), timestamp: new Date() },
    });
    dispatch({ type: "SET_LOADING", payload: true });

    // 2. Placeholder assistant (streaming)
    dispatch({
      type: "ADD_MESSAGE",
      payload: { id: uid(), role: "model", content: "", timestamp: new Date(), isStreaming: true },
    });

    try {
      for await (const chunk of streamAIResponse(msg, state.context, state.messages)) {
        if (chunk.error) {
          dispatch({ type: "SET_ERROR", payload: chunk.error });
          dispatch({ type: "FINISH_STREAMING" });
          return;
        }
        if (chunk.done) break;
        if (chunk.delta) dispatch({ type: "STREAM_DELTA", payload: chunk.delta });
      }
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err instanceof Error ? err.message : "Erreur inconnue" });
    } finally {
      dispatch({ type: "FINISH_STREAMING" });
    }
  }, [state.isLoading, state.context, state.messages]);

  return (
    <AIAgentContext.Provider value={{ state, openAgent, closeAgent, setContext, sendMessage, clearMessages }}>
      {children}
    </AIAgentContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────
export function useAIAgent() {
  const ctx = useContext(AIAgentContext);
  if (!ctx) throw new Error("useAIAgent doit être utilisé dans <AIAgentProvider>");
  return ctx;
}



// "use client";
// // ================================================================
// // XCSM V3 — Context global Agent IA
// // Fichier : contexts/AIAgentContext.tsx
// // ================================================================

// import React, {
//   createContext,
//   useCallback,
//   useContext,
//   useReducer,
// } from "react";
// import { streamMessageFromAI } from "@/services/aiService";
// import {
//   AIAgentState,
//   ChatMessage,
//   GranuleContext,
// } from "@/types/ai.types";

// // ─── ID unique côté client (sans uuid externe) ────────────────
// function genId(): string {
//   return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
// }

// // ─── État initial ─────────────────────────────────────────────
// const initialState: AIAgentState = {
//   isOpen: false,
//   isLoading: false,
//   messages: [],
//   context: null,
//   error: null,
// };

// // ─── Reducer ──────────────────────────────────────────────────
// type Action =
//   | { type: "OPEN" }
//   | { type: "CLOSE" }
//   | { type: "SET_CONTEXT"; payload: GranuleContext }
//   | { type: "ADD_MESSAGE"; payload: ChatMessage }
//   | { type: "STREAM_DELTA"; payload: string }
//   | { type: "FINISH_STREAMING" }
//   | { type: "SET_LOADING"; payload: boolean }
//   | { type: "SET_ERROR"; payload: string | null }
//   | { type: "CLEAR_MESSAGES" };

// function reducer(state: AIAgentState, action: Action): AIAgentState {
//   switch (action.type) {
//     case "OPEN":
//       return { ...state, isOpen: true };
//     case "CLOSE":
//       return { ...state, isOpen: false };
//     case "SET_CONTEXT":
//       return { ...state, context: action.payload };
//     case "ADD_MESSAGE":
//       return { ...state, messages: [...state.messages, action.payload] };
//     case "STREAM_DELTA": {
//       const msgs = [...state.messages];
//       const last = msgs[msgs.length - 1];
//       if (last?.isStreaming) {
//         msgs[msgs.length - 1] = {
//           ...last,
//           content: last.content + action.payload,
//         };
//       }
//       return { ...state, messages: msgs };
//     }
//     case "FINISH_STREAMING": {
//       const msgs = [...state.messages];
//       const last = msgs[msgs.length - 1];
//       if (last) msgs[msgs.length - 1] = { ...last, isStreaming: false };
//       return { ...state, messages: msgs, isLoading: false };
//     }
//     case "SET_LOADING":
//       return { ...state, isLoading: action.payload };
//     case "SET_ERROR":
//       return { ...state, error: action.payload, isLoading: false };
//     case "CLEAR_MESSAGES":
//       return { ...state, messages: [], error: null };
//     default:
//       return state;
//   }
// }

// // ─── Context type ─────────────────────────────────────────────
// interface AIAgentContextValue {
//   state: AIAgentState;
//   openAgent: () => void;
//   closeAgent: () => void;
//   setContext: (ctx: GranuleContext) => void;
//   sendMessage: (message: string) => Promise<void>;
//   clearMessages: () => void;
// }

// const AIAgentContext = createContext<AIAgentContextValue | null>(null);

// // ─── Provider ─────────────────────────────────────────────────
// export function AIAgentProvider({ children }: { children: React.ReactNode }) {
//   const [state, dispatch] = useReducer(reducer, initialState);

//   const openAgent = useCallback(() => dispatch({ type: "OPEN" }), []);
//   const closeAgent = useCallback(() => dispatch({ type: "CLOSE" }), []);
//   const clearMessages = useCallback(() => dispatch({ type: "CLEAR_MESSAGES" }), []);
//   const setContext = useCallback(
//     (ctx: GranuleContext) => dispatch({ type: "SET_CONTEXT", payload: ctx }),
//     []
//   );

//   const sendMessage = useCallback(
//     async (message: string) => {
//       if (!message.trim() || state.isLoading) return;

//       dispatch({ type: "SET_ERROR", payload: null });

//       // Message utilisateur
//       dispatch({
//         type: "ADD_MESSAGE",
//         payload: {
//           id: genId(),
//           role: "user",
//           content: message.trim(),
//           timestamp: new Date(),
//         },
//       });
//       dispatch({ type: "SET_LOADING", payload: true });

//       // Placeholder assistant (streaming)
//       dispatch({
//         type: "ADD_MESSAGE",
//         payload: {
//           id: genId(),
//           role: "model",
//           content: "",
//           timestamp: new Date(),
//           isStreaming: true,
//         },
//       });

//       try {
//         const stream = streamMessageFromAI(
//           message,
//           state.context,
//           state.messages
//         );

//         for await (const chunk of stream) {
//           if (chunk.error) {
//             dispatch({ type: "SET_ERROR", payload: chunk.error });
//             dispatch({ type: "FINISH_STREAMING" });
//             return;
//           }
//           if (chunk.done) break;
//           if (chunk.delta) {
//             dispatch({ type: "STREAM_DELTA", payload: chunk.delta });
//           }
//         }
//         dispatch({ type: "FINISH_STREAMING" });
//       } catch (err) {
//         const msg = err instanceof Error ? err.message : "Erreur inconnue";
//         dispatch({ type: "SET_ERROR", payload: msg });
//         dispatch({ type: "FINISH_STREAMING" });
//       }
//     },
//     [state.isLoading, state.context, state.messages]
//   );

//   return (
//     <AIAgentContext.Provider
//       value={{ state, openAgent, closeAgent, setContext, sendMessage, clearMessages }}
//     >
//       {children}
//     </AIAgentContext.Provider>
//   );
// }

// // ─── Hook consommateur ────────────────────────────────────────
// export function useAIAgent(): AIAgentContextValue {
//   const ctx = useContext(AIAgentContext);
//   if (!ctx)
//     throw new Error("useAIAgent doit être utilisé dans <AIAgentProvider>");
//   return ctx;
// }