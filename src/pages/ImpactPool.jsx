import ImpactPoolVisualization from "@/components/ImpactPoolVisualization";

export default function ImpactPool() {
  return (
    <ImpactPoolVisualization onClose={() => window.history.back()} />
  );
}