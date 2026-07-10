import { useState, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "motion/react"

const IMAGES = [
  "/images/background_images/269d414c1d45753fb3525a3cc32d83cd.jpg",
  "/images/background_images/32d2bb8a5a95a7a2ebb62b6157fcdd41.jpg",
  "/images/background_images/9ebe12b03d0a5b025b09d93e6339ae6d.jpg",
  "/images/background_images/c3f3d32f3ecb48806799d4ad359c873d.jpg",
  "/images/background_images/c7a3010308456d51ae9c66aa23afcc48.jpg",
  "/images/background_images/ce62e899c2bfc9ed5a5ba7209fc08b56.jpg",
  "/images/background_images/cead75f28fdccb2b7dad482a6c7301af.jpg",
  "/images/background_images/d652ddf9523d5cffc4afa9f7fd5d8bcb.jpg",
]

const INTERVAL = 6000

export function AuthImagePanel() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * IMAGES.length)
  )

  const nextImage = useCallback(() => {
    setIndex((i) => (i + 1) % IMAGES.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextImage, INTERVAL)
    return () => clearInterval(timer)
  }, [nextImage])

  return (
    <div className="hidden w-1/2 overflow-hidden rounded-3xl lg:block">
      <div className="relative h-full w-full">
        {/* Carousel images */}
        <AnimatePresence mode="popLayout">
          <motion.img
            key={index}
            src={IMAGES[index]}
            alt="Restaurant"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Branding text over image */}
        <div className="absolute inset-x-0 bottom-0 p-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <img
              src="/holyfork-logo.svg"
              alt="Holy Fork"
              className="mb-4 h-8 brightness-0 invert"
            />
            <p className="text-lg font-medium text-white/90">
              La gestion de restaurant, simplifiée.
            </p>
            <p className="mt-1 text-sm text-white/60">
              Réservations, planning, stocks, commandes — tout au même endroit.
            </p>
          </motion.div>
        </div>

        {/* Dot indicators */}
        <div className="absolute right-8 bottom-8 flex gap-1.5">
          {IMAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? "w-6 bg-white/80" : "w-1 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
