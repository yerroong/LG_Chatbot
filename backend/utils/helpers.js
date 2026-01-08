import crypto from "crypto";

// IP 주소 가져오기 함수
export const getClientIP = (socket) => {
  // 로컬 개발 환경에서는 고정 IP 사용
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-ip";
  }

  const forwarded = socket.handshake.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Socket.io v4+ 에서는 socket.conn.remoteAddress 사용
  const address =
    socket.handshake.address ||
    socket.conn.remoteAddress ||
    socket.request?.connection?.remoteAddress;

  // IPv6 로컬호스트를 IPv4로 변환
  if (address === "::1" || address === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  return address || "unknown";
};

// IP 기반 세션 ID 생성
export const generateSessionId = (ip, userAgent = "") => {
  // 로컬 개발 환경에서는 브라우저 정보만으로 세션 ID 생성
  if (process.env.NODE_ENV !== "production" || ip === "local-dev-ip") {
    // User-Agent의 주요 부분만 추출하여 더 안정적인 세션 ID 생성
    const browserInfo = userAgent.match(
      /(Chrome|Firefox|Safari|Edge)\/[\d.]+/g
    ) || ["unknown"];
    const stableUserAgent = browserInfo.join("-");

    const hash = crypto
      .createHash("sha256")
      .update(`local-${stableUserAgent}`)
      .digest("hex");
    return `local_${hash.substring(0, 16)}`;
  }

  // 프로덕션 환경에서는 IP + User-Agent 조합
  const hash = crypto
    .createHash("sha256")
    .update(ip + userAgent)
    .digest("hex");
  return `ip_${hash.substring(0, 16)}`;
};
