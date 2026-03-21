import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { InfoBoxProps } from "../../pages/constants";

export default function InfoBox({
  title,
  content,
  initialHeight = "4.5rem",
}: InfoBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const actualHeight = contentRef.current.scrollHeight;
      const heightInPx = parseFloat(initialHeight) * 16; // 1rem = 16px
      setShouldCollapse(actualHeight > heightInPx);
    }
  }, [content, initialHeight]);

  const toggleExpand = () => setExpanded(!expanded);

  return (
    <div className="px-8 py-7 inset-shadow-sm shadow-md">
      <h2 className="text-2xl text-left mb-4">{title}</h2>
      <motion.div
        initial={false}
        animate={{
          height: !shouldCollapse || expanded ? "auto" : initialHeight,
        }}
        className="overflow-hidden"
      >
        <div ref={contentRef}>
          <p className="text-black text-left whitespace-pre-line">{content}</p>
        </div>
      </motion.div>
      {shouldCollapse && (
        <div className="flex justify-end">
          <button className="btn btn-link" onClick={toggleExpand}>
            <p className="text-black underline decoration-black text-xs">
              {expanded ? "Read less" : "Read more"}
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
