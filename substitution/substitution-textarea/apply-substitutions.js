export const applySubstitutions = (input, rules) =>
  rules
    .reduce(
      (text, [search, replace]) => text.replaceAll(search, replace),
      input,
    )
    .normalize("NFKC")
