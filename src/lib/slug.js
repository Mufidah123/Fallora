// Helper URL kategori bergaya: /Elektronik-Gadget-cat.3

export function slugify(name = "") {
    return String(name)
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function categoryPath(category) {
    return `/${slugify(category.name)}-cat.${category.id}`;
}

// "Elektronik-Gadget-cat.3" -> { slug: "Elektronik-Gadget", id: 3 }, selain itu null
export function parseCategorySlug(value = "") {
    let decoded = value;
    try {
        decoded = decodeURIComponent(value);
    } catch {
        return null;
    }
    const match = /^(.*)-cat\.(\d+)$/.exec(decoded);
    if (!match) return null;
    return { slug: match[1], id: Number(match[2]) };
}
