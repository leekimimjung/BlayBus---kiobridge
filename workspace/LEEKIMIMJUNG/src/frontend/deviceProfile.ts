/**
 * 무로그인 QR 프로필 — docs/LOGINLESS_QR_PROFILE_GUIDE.md
 *
 * 이 파일은 두 가지만 합니다:
 *   1. Mock QR 페이로드 만들기 — environmentId·fixtureVersion·일회용 nonce만 담습니다.
 *      실제 개인정보는 절대 넣지 않습니다 (가이드 문서 §1).
 *   2. 접근성 설정을 "이 기기"의 localStorage 에 저장·조회·삭제하기 — 접근성 설정만
 *      저장하며(가이드 §2), 이름·연락처 등은 애초에 다루지 않습니다.
 *
 * 자동으로 불러온 값은 반드시 화면에 보여주고 사용자 확인을 받아야 합니다(가이드 §3-8).
 * 이 파일은 저장소 읽기/쓰기만 담당하고, 확인 UX는 collectProfile.ts 에서 처리합니다.
 */
import type { AccessibilityState } from "./collectProfile.ts";

const STORAGE_KEY = "kiobridge.leekimimjung.deviceProfile.v1";

/** QR에 담기는 값 — 환경 정보와 일회용 nonce뿐, 개인정보 없음. */
export interface MockQrPayload {
  environmentId: string;
  fixtureVersion: string;
  sessionNonce: string;
}

/** 기기에 저장되는 값 — 접근성 설정 + 저장 시각뿐. */
export interface StoredDeviceProfile {
  settings: AccessibilityState;
  savedAt: string;
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

/** 이 기기에 저장된 접근성 설정을 읽습니다. 없거나 손상되었으면 null. */
export function loadDeviceProfile(): StoredDeviceProfile | null {
  if (!hasLocalStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDeviceProfile>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.savedAt !== "string" || !parsed.settings) return null;
    return { settings: parsed.settings, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

/** 접근성 설정만 이 기기에 저장합니다 (선택사항 — 저장하지 않아도 전체 흐름을 쓸 수 있어요). */
export function saveDeviceProfile(settings: AccessibilityState): boolean {
  if (!hasLocalStorage()) return false;
  try {
    const record: StoredDeviceProfile = { settings, savedAt: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** 저장된 설정을 지웁니다 (한 번의 조작으로 삭제 — 가이드 §6). */
export function clearDeviceProfile(): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* 무시 — 지우기 실패해도 흐름은 계속됩니다 */
  }
}

/**
 * Mock QR 페이로드를 만듭니다. 실제 카메라 스캔이 아니라 데모용 예시 QR입니다
 * (docs/LOGINLESS_QR_PROFILE_GUIDE.md §"실제 예제"의 Mock QR과 동일한 개념).
 */
export function buildMockQrPayload(): MockQrPayload {
  const sessionNonce =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `DEMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    environmentId: "hospital",
    fixtureVersion: "hospital@0.2.0",
    sessionNonce,
  };
}
