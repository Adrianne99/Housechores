export const CommentField = ({ value, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Comment <span className="text-gray-300 font-normal">(required)</span>
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="e.g. Price adjustment due to supplier change..."
      rows={2}
      required
      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300 bg-white resize-none"
    />
  </div>
);
