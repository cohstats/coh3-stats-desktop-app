import React from "react";

export const COHDBIcon: React.FC<{ size?: number }> = ({size}) => {
  size = size || 22
  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
           className="border border-2 border-lighter rounded-4 p-2" viewBox="0 0 1792 1792">
        <path fill="#f2b632"
              d="M896 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5T231 896 128 768V598q119 84 325 127t443 43zm0 768q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128v-170q119 84 325 127t443 43zm0-384q237 0 443-43t325-127v170q0 69-103 128t-280 93.5-385 34.5-385-34.5-280-93.5-103-128V982q119 84 325 127t443 43zM896 0q208 0 385 34.5t280 93.5 103 128v128q0 69-103 128t-280 93.5T896 640t-385-34.5T231 512 128 384V256q0-69 103-128t280-93.5T896 0z"/>
      </svg>
    </>
  )
}
