const BASE_URL = "http://127.0.0.1:8000/api";

export const api = {
    inventory: {
        list: async (params = {}) => {
            const qs = new URLSearchParams(
                Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
            ).toString();
            const res = await fetch(`${BASE_URL}/inventory${qs ? `?${qs}` : ""}`);
            if (!res.ok) throw new Error("Failed to fetch inventory");
            return res.json();
        },

        create: async (body) => {
            const res = await fetch(`${BASE_URL}/inventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(err.detail || "Failed to create dress");
            }
            return res.json();
        },
    },

    // bookings added Part 2
};