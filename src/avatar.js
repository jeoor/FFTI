/**
 * 根据类型代码返回头像 URL
 * @param {string} code 类型代码 (e.g. "FIRE", "LOOP404")
 * @returns {string|null} 头像路径，不存在时返回 null
 */
export function getAvatarUrl(code) {
  if (!code) return null
  return `./ffti-avatars/${code}.svg`
}
