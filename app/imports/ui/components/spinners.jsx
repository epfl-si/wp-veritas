import React from "react";
export const bouncyCircle = <svg width="32" height="32" viewBox="0 0 24 24">
    <style>
    {`
        .spinner_ZCsl {
            animation: spinner_qV4G 1.2s cubic-bezier(0.52,.6,.25,.99) infinite
        }
        .spinner_gaIW { animation-delay: .6s }
        @keyframes spinner_qV4G { 
            0% { r: 0; opacity: 1 }
            100% { r: 11px; opacity: 0 }
        }
    `}
    </style>
    <circle className="spinner_ZCsl" cx="12" cy="12" r="0"/>
    <circle className="spinner_ZCsl spinner_gaIW" cx="12" cy="12" r="0"/>
</svg>;
