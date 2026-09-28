interface Props {
  isStreaming: boolean;
}

export default function StreamingCursor({ isStreaming }: Props) {
  if (!isStreaming) return null;
  return (
    <span
      className="inline-block w-[2px] h-[1em] ml-1 bg-violet-400 animate-pulse align-middle rounded-sm"
      style={{ animationDuration: "0.8s" }}
    />
  );
}