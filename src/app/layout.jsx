import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  title: "SWGVI - Sistema Web de Gestión de Ventas e Inventario",
  description: "Punto de Venta e Inventario Inteligente",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        {children}
        <Toaster
          position="top-right"
          closeButton
          duration={4000}
          theme="system"
          toastOptions={{
            className:
              "!rounded-xs !border !border-border !bg-card !text-foreground !shadow-xs !font-mono text-xs !p-3",
            classNames: {
              toast:
                "!rounded-xs !border !border-border !bg-card !text-foreground !shadow-xs !font-mono text-xs",
              title:
                "!font-mono !text-xs !font-semibold !text-foreground !tracking-tight",
              description:
                "!font-mono !text-xs !text-muted-foreground !mt-0.5 !leading-relaxed",
              actionButton:
                "!rounded-xs !bg-primary !text-primary-foreground !font-mono !text-xs !px-2.5 !py-1 !font-medium",
              cancelButton:
                "!rounded-xs !bg-muted !text-muted-foreground !font-mono !text-xs !px-2.5 !py-1",
              closeButton:
                "!rounded-xs !border !border-border !bg-background hover:!bg-muted !text-muted-foreground hover:!text-foreground",
              success:
                "!border-emerald-500/40 !border-l-2 !border-l-emerald-500 [&_[data-icon]]:!text-emerald-500",
              error:
                "!border-rose-500/40 !border-l-2 !border-l-rose-500 [&_[data-icon]]:!text-rose-500",
              warning:
                "!border-amber-500/40 !border-l-2 !border-l-amber-500 [&_[data-icon]]:!text-amber-500",
              info: "!border-primary/40 !border-l-2 !border-l-primary [&_[data-icon]]:!text-primary",
            },
          }}
        />
      </body>
    </html>
  );
}
