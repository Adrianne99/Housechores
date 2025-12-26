import { useRef } from "react";

const useOtpInput = (length = 6) => {
  const inputRefs = useRef([]);

  const handleInput = (e, index) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);

    if (e.target.value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const paste = e.clipboardData.getData("text").replace(/\D/g, "");
    paste
      .split("")
      .slice(0, length)
      .forEach((char, index) => {
        if (inputRefs.current[index]) {
          inputRefs.current[index].value = char;
        }
      });

    const lastIndex = Math.min(paste.length, length) - 1;
    if (lastIndex >= 0) {
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return {
    inputRefs,
    handleInput,
    handleKeyDown,
    handlePaste,
  };
};

export default useOtpInput;
