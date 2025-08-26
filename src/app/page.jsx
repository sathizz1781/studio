import { WeighbridgeForm } from "@/components/weighbridge-form";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-start p-2 pt-4 sm:p-4 md:p-6 md:pt-8 bg-background">
      <WeighbridgeForm />
    </div>
  );
}
