import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface CalendlyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  barberName: string;
}

const CalendlyModal = ({ open, onOpenChange, url, barberName }: CalendlyModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] h-[85vh] p-0 bg-card border-border overflow-hidden gap-0">
        <VisuallyHidden>
          <DialogTitle>احجز مع {barberName}</DialogTitle>
        </VisuallyHidden>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/50">
          <h3 className="font-heading font-bold text-lg text-gold-gradient">احجز مع {barberName}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {/* Calendly iframe */}
        <div className="flex-1 h-full">
          <iframe
            src={url}
            className="w-full h-full border-0"
            style={{ minHeight: "calc(85vh - 52px)" }}
            title={`حجز مع ${barberName}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendlyModal;
