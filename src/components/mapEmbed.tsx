import React from "react";

const MapEmbed = () => {
  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-xl">
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.597964127854!2d1.1973018!3d6.1845251999999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x102159d032dad793%3A0xf3d468801779cbed!2sCr%C3%A8che-Garderie-Maternelle%20Les%20Petits%20Rayons%20de%20Soleil!5e0!3m2!1sfr!2stg!4v1760130857575!5m2!1sfr!2stg" 
        className="absolute top-1/2 left-1/2 w-[120vw] h-[120vh] -translate-x-1/2 -translate-y-1/2"
        loading="lazy"></iframe>
    </div>
  );
};

export default MapEmbed;