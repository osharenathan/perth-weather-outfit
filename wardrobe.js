import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

const itemList = document.getElementById("itemList");
const todayPicks = document.getElementById("todayPicks");
const addItemForm = document.getElementById("addItemForm");
const itemSleeveField = document.getElementById("itemSleeveField");
const itemCategory = document.getElementById("itemCategory");

const CATEGORY_LABEL = {
  shirt: "Shirt",
  trousers: "Trousers",
  jacket: "Jacket",
  shoes: "Shoes",
  scarf: "Scarf",
  accessory: "Accessory",
};

let items = [];
let latestOutfitSpec = window.__lastOutfitSpec || null;

function renderItems() {
  if (!items.length) {
    itemList.innerHTML = `<li class="empty">No items yet — add your first piece above.</li>`;
    return;
  }
  itemList.innerHTML = items
    .map(
      (item) => `
      <li>
        <span class="swatch" style="background:${item.color_hex}"></span>
        <span class="item-name">${item.name}</span>
        <span class="item-meta">${CATEGORY_LABEL[item.category] || item.category}${item.sleeve_length ? " · " + item.sleeve_length : ""}</span>
        <button type="button" class="delete-btn" data-id="${item.id}" aria-label="Delete">✕</button>
      </li>`
    )
    .join("");
  itemList.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteItem(btn.dataset.id));
  });
}

async function loadItems() {
  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    itemList.innerHTML = `<li class="empty">Couldn't load wardrobe: ${error.message}</li>`;
    items = [];
  } else {
    items = data;
    renderItems();
  }
  computeTodayPicks();
}

async function deleteItem(id) {
  await supabase.from("wardrobe_items").delete().eq("id", id);
  loadItems();
}

itemCategory.addEventListener("change", () => {
  itemSleeveField.style.display = itemCategory.value === "shirt" ? "block" : "none";
});

addItemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("itemName").value.trim();
  if (!name) return;
  const category = itemCategory.value;
  const sleeve_length = category === "shirt" ? document.getElementById("itemSleeve").value : null;
  const color_hex = document.getElementById("itemColor").value;
  const formality = document.getElementById("itemFormality").value;
  const warmth_level = Number(document.getElementById("itemWarmth").value);

  const { error } = await supabase
    .from("wardrobe_items")
    .insert({ name, category, sleeve_length, color_hex, formality, warmth_level });
  if (error) {
    alert(`Couldn't save item: ${error.message}`);
    return;
  }
  addItemForm.reset();
  document.getElementById("itemWarmth").value = 3;
  itemSleeveField.style.display = "block";
  loadItems();
});

function bestMatch(category, { warmthTarget, sleeveLength }) {
  let candidates = items.filter((i) => i.category === category);
  if (!candidates.length) return null;
  if (category === "shirt" && sleeveLength) {
    const sleeveMatches = candidates.filter((i) => i.sleeve_length === sleeveLength);
    if (sleeveMatches.length) candidates = sleeveMatches;
  }
  candidates = [...candidates].sort(
    (a, b) => Math.abs(a.warmth_level - warmthTarget) - Math.abs(b.warmth_level - warmthTarget)
  );
  return candidates[0];
}

function computeTodayPicks() {
  const picks = { shirt: null, trousers: null, shoes: null, jacket: null, scarf: null };

  if (latestOutfitSpec) {
    const spec = latestOutfitSpec;
    const warmthTarget = spec.warmthTarget ?? 3;
    picks.shirt = bestMatch("shirt", { warmthTarget, sleeveLength: spec.shirtSleeve });
    picks.trousers = bestMatch("trousers", { warmthTarget });
    picks.shoes = bestMatch("shoes", { warmthTarget });
    picks.jacket = spec.jacket ? bestMatch("jacket", { warmthTarget }) : null;
    picks.scarf = spec.scarf ? bestMatch("scarf", { warmthTarget }) : null;
  }

  const anyPicked = Object.values(picks).some(Boolean);
  if (!anyPicked) {
    todayPicks.innerHTML = `<div class="picks-empty">Add a shirt, trousers and shoes to your wardrobe to get today's pick from your real closet.</div>`;
  } else {
    const rows = Object.entries(picks)
      .filter(([, item]) => item)
      .map(([, item]) => `<li><span class="swatch" style="background:${item.color_hex}"></span>${item.name}</li>`)
      .join("");
    todayPicks.innerHTML = `<h3>From your closet today</h3><ul class="picks-list">${rows}</ul>`;
  }

  window.dispatchEvent(new CustomEvent("wardrobe-picks-updated", { detail: picks }));
}

window.addEventListener("outfit-updated", (e) => {
  latestOutfitSpec = e.detail;
  computeTodayPicks();
});

loadItems();
