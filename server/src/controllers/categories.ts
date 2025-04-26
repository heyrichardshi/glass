import { Request, Response } from "express";
import * as categories from "../services/categories";
import { ConflictError, NotFoundError } from "../common/errors";

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

export async function createCategory(req: Request, res: Response) {
  const userId = req.query.userId as string | undefined; // ?userId=...
  const name = req.query.name as string | undefined; // ?name=...
  const parentId = req.query.parentId as string | undefined; // ?parentId=...

  if (!userId) {
    res.status(400).json({ message: "Missing userId" });
    return;
  }

  if (!name) {
    res.status(400).json({ message: "Missing category name" });
    return;
  }

  try {
    const category = await categories.createCategory({
      householdId: userId,
      name,
      parentId,
    });
    res.status(200).json(category);
  } catch (error: any) {
    if (error instanceof ConflictError) {
      res.status(409).json({ message: error.message });
      return;
    } else if (error instanceof NotFoundError) {
      res.status(404).json({ message: error.message });
      return;
    } else {
      console.error("Error adding category:", error);
      res.status(500).json({ message: error.message });
    }
  }
}
