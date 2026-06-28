import { createContext, useContext } from "react";

interface GuestContextType {
  isGuest: boolean;
  onSignIn: () => void;
}

export const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  onSignIn: () => {},
});

export function useGuest() {
  return useContext(GuestContext);
}
