import React from "react";
export function Skel({ w="100%", h=14, r=10, mb=0 }) {
  return <div className="dp-skel" style={{ width:w, height:h, borderRadius:r, marginBottom:mb }} />;
}
