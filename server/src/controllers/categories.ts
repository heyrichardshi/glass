import { Request, Response } from "express";
import * as categories from "../services/categories";

export async function listCategories(req: Request, res: Response) {
  const userId = req.query.userId as string | undefined; // ?userId=...
  console.log("userId:", userId);

  if (!userId) {
    res.status(400).json({ message: "Missing userId" });
    return;
  }

  try {
    const categoriesList = await categories.listCategories({
      householdId: userId,
    });
    res.status(200).json(categoriesList);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: error.message });
  }
}
