import { WeighbridgeForm } from "@/components/weighbridge-form";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start p-4 pt-8 sm:p-8 md:p-12 md:pt-16 bg-background">
      <WeighbridgeForm />
    </div>
  );
}
