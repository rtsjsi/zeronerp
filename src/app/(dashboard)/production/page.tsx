"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, FlaskConical, Factory } from "lucide-react";
import { TabToolbar } from "@/components/shared/tab-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { RecipeTable } from "@/components/production/recipe-table";
import { CreateRecipeDialog } from "@/components/production/create-recipe-dialog";
import { EditRecipeDialog } from "@/components/production/edit-recipe-dialog";
import { ProductionBatchTable } from "@/components/production/production-batch-table";
import { DeclareProductionDialog } from "@/components/production/declare-production-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState("production");
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isEditRecipeOpen, setIsEditRecipeOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState<any | null>(null);
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: recipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ["production-recipes"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/production/recipes");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const { data: batches, isLoading: isLoadingBatches } = useQuery({
    queryKey: ["production-batches"],
    queryFn: async () => {
      const res = await apiFetch<any[]>("/api/production/batches");
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
  });

  const filteredRecipes = recipes?.filter((recipe: any) =>
    recipe.finishedItem?.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredBatches = batches?.filter((batch: any) =>
    batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.outputs?.some((output: any) =>
      output.item?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ||
    batch.recipe?.finishedItem?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteRecipe = async (id: string) => {
    if (!confirm("Delete this recipe?")) return;
    const res = await apiFetch(`/api/production/recipes/${id}`, { method: "DELETE" });
    if (res.success) {
      toast.success("Recipe deleted");
      queryClient.invalidateQueries({ queryKey: ["production-recipes"] });
    } else {
      toast.error(res.message || "Failed to delete recipe");
    }
  };

  return (
    <div className="animate-fade-in min-w-0">
      <Tabs value={activeTab} className="w-full min-w-0" onValueChange={setActiveTab}>
        <TabToolbar
          tabs={
            <TabsList variant="line" className="w-max min-w-full sm:min-w-0">
              <TabsTrigger value="production" className="gap-2 shrink-0">
                <Factory className="w-4 h-4 shrink-0" /> Production
              </TabsTrigger>
              <TabsTrigger value="recipes" className="gap-2 shrink-0">
                <FlaskConical className="w-4 h-4 shrink-0" /> Recipes
              </TabsTrigger>
            </TabsList>
          }
          actions={
            activeTab === "production" ? (
              <Button onClick={() => setIsDeclareOpen(true)} className="gap-2 shrink-0">
                <Plus className="w-4 h-4 shrink-0" /> Declare Production
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsRecipeOpen(true)} className="gap-2 shrink-0">
                <FlaskConical className="w-4 h-4 shrink-0" /> Add Recipe
              </Button>
            )
          }
        >
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
        </TabToolbar>

        <TabsContent value="production" className="mt-3">
          {isLoadingBatches ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredBatches && filteredBatches.length > 0 ? (
            <ProductionBatchTable batches={filteredBatches} />
          ) : (
            <EmptyState
              icon={Factory}
              title={searchQuery ? "No matching production records" : "No production declared yet"}
              description={
                searchQuery
                  ? `No production records found matching "${searchQuery}".`
                  : "Declare production from a recipe to consume raw materials and add finished goods."
              }
              actionLabel={searchQuery ? "Clear Search" : "Declare Production"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsDeclareOpen(true))}
            />
          )}
        </TabsContent>

        <TabsContent value="recipes" className="mt-3">
          {isLoadingRecipes ? (
            <div className="grid place-items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredRecipes && filteredRecipes.length > 0 ? (
            <RecipeTable
              recipes={filteredRecipes}
              onEdit={(recipe) => {
                setEditRecipe(recipe);
                setIsEditRecipeOpen(true);
              }}
              onDelete={handleDeleteRecipe}
            />
          ) : (
            <EmptyState
              icon={FlaskConical}
              title={searchQuery ? "No matching recipes" : "No recipes yet"}
              description={
                searchQuery
                  ? `No recipes found matching "${searchQuery}".`
                  : "Create a recipe to define raw materials per unit of finished good."
              }
              actionLabel={searchQuery ? "Clear Search" : "Add Recipe"}
              onAction={() => (searchQuery ? setSearchQuery("") : setIsRecipeOpen(true))}
            />
          )}
        </TabsContent>
      </Tabs>

      <CreateRecipeDialog
        open={isRecipeOpen}
        onOpenChange={setIsRecipeOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["production-recipes"] })}
      />

      <EditRecipeDialog
        open={isEditRecipeOpen}
        onOpenChange={(open) => {
          setIsEditRecipeOpen(open);
          if (!open) setEditRecipe(null);
        }}
        recipe={editRecipe}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["production-recipes"] })}
      />

      <DeclareProductionDialog
        open={isDeclareOpen}
        onOpenChange={setIsDeclareOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["production-batches"] });
          queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
          queryClient.invalidateQueries({ queryKey: ["inventory-transactions"] });
        }}
      />
    </div>
  );
}
