"use client";

import { FallingLeaves } from "falling-leaves/react";

// Efek daun berguguran dekoratif untuk homepage
export default function Leaves() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0 select-none overflow-hidden opacity-45"
        >
            <FallingLeaves count={14} minSize={22} maxSize={32} />
        </div>
    );
}
