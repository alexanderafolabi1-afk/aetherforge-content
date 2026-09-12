import { CommandDeck } from "@/components/deck/command-deck";
import { PinGate } from "@/components/deck/pin-gate";

export default function App() {
  return (
    <PinGate>
      <CommandDeck />
    </PinGate>
  );
}
