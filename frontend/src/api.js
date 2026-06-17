const BASE_URL = "http://127.0.0.1:8000/api";

export const api = {
    inventory: {
        // Fetch all dresses from the backend
        list: async () => {
            const response = await fetch(`${BASE_URL}/operations/inventory`);
            if (!response.ok) {
                throw new Error("Failed to fetch inventory");
            }
            return response.json();
        },

        // Create a new dress in the backend
        create: async (dressData) => {
            const response = await fetch(`${BASE_URL}/operations/inventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dressData),
            });
            if (!response.ok) {
                throw new Error("Failed to create dress");
            }
            return response.json();
        },
    },
};