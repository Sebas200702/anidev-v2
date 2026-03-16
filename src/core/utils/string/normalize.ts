export const normalizeString = ({
  string,
  removeSpaces = true,
  separator = '-',
  toLowerCase = false,
}: {
  string: string
  removeSpaces?: boolean
  separator?: string
  toLowerCase?: boolean
}): string => {
  if (!string) return ''
  const specialCharsPattern = /[/?¡.:,;¿!@#$%^&*()\-_=+[\]{}|\\'<>`~"]/g

  // Remove special characters
  let result = string.replaceAll(specialCharsPattern, '')

  // Handle spaces based on parameters
  if (removeSpaces) {
    result = result.replaceAll(/\s/g, separator)
  }
  // Convert to lowercase if requested
  return toLowerCase ? result.toLowerCase() : result
}
