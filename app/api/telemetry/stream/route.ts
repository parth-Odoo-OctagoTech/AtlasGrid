import { NextRequest } from "next/server";
import { gridPhysicsEngine } from "@/lib/simulator/grid-physics-engine";
import { plantRepository } from "@/lib/db/plant-repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Periodic physics tick and delta broadcast
      const interval = setInterval(() => {
        try {
          if (req.signal.aborted) {
            clearInterval(interval);
            controller.close();
            return;
          }

          // Step physics simulation
          const tickResult = gridPhysicsEngine.stepSimulation();
          const summary = plantRepository.getGlobalSummary();

          const payload = {
            timestamp: new Date().toISOString(),
            frequencies: tickResult.frequencies,
            updatedPlantsCount: tickResult.updatedPlants.length,
            sampleUpdatedPlants: tickResult.updatedPlants,
            summary: {
              totalCapacityMw: summary.totalCapacityMw,
              totalGenerationMw: summary.totalGenerationMw,
              cleanEnergySharePercent: summary.cleanEnergySharePercent,
              averageSpotPrice: summary.averageSpotPrice,
              activePlantsCount: summary.activePlantsCount,
            },
            newAlerts: tickResult.newAlerts,
          };

          controller.enqueue(
            encoder.encode(`event: tick\ndata: ${JSON.stringify(payload)}\n\n`)
          );
        } catch (err) {
          console.error("Error during telemetry stream tick:", err);
          clearInterval(interval);
          controller.close();
        }
      }, 2500);

      // Listen for abort signal
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
