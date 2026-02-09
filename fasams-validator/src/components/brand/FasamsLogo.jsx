import React from 'react';

const FasamsLogo = ({ className = "w-10 h-10" }) => {
    // Using Tailwind's theme color dynamically, but defaulting to Indigo-600 if not provided otherwise.
    // The explicit HEX #4F46E5 ensures brand consistency even if tailwind config changes slightly.
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={className}
            aria-labelledby="fasamsLogoTitle"
            role="img"
        >
            <title id="fasamsLogoTitle">FASAMS Data Validator Logo</title>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM10.5858 16L6.29289 11.7071C5.90237 11.3166 5.90237 10.6834 6.29289 10.2929C6.68342 9.90237 7.31658 9.90237 7.70711 10.2929L10.5858 13.1716L16.2929 7.46447C16.6834 7.07394 17.3166 7.07394 17.7071 7.46447C18.0976 7.85499 18.0976 8.48816 17.7071 8.87868L11.2929 15.2929C11.1054 15.4804 10.851 15.5858 10.5858 15.5858C10.3206 15.5858 10.0662 15.4804 9.87868 15.2929L10.5858 16Z"
                fill="#4F46E5"
            />
        </svg>
    );
};

export default FasamsLogo;
