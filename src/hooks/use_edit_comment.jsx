import { useState } from "react";

export const useEditComment = () => {
  const [comment, setComment] = useState("");
  const resetComment = () => setComment("");
  return { comment, setComment, resetComment };
};
