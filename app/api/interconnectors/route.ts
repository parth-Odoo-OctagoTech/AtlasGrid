import { NextResponse } from "next/server";
import { plantRepository } from "@/lib/db/plant-repository";

export async function GET() {
  try {
    const interconnectors = plantRepository.getInterconnectors();
    return NextResponse.json({
      success: true,
      count: interconnectors.length,
      data: interconnectors,
    });
  } catch (error) {
    console.error("Error fetching interconnectors:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
