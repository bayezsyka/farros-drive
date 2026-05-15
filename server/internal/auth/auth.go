package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

const DefaultCookieName = "farros_drive_session"

var ErrInvalidCredentials = errors.New("invalid credentials")

type sessionPayload struct {
	ExpiresAt int64 `json:"expiresAt"`
	IssuedAt  int64 `json:"issuedAt"`
}

type Manager struct {
	Password        string
	CookieName      string
	SessionDuration time.Duration
}

func NewManager(password string) *Manager {
	return &Manager{
		Password:        password,
		CookieName:      DefaultCookieName,
		SessionDuration: 7 * 24 * time.Hour,
	}
}

func (m *Manager) Configured() bool {
	return strings.TrimSpace(m.Password) != ""
}

func (m *Manager) AuthenticateRequest(r *http.Request) bool {
	if !m.Configured() {
		return true
	}

	cookie, err := r.Cookie(m.CookieName)
	if err != nil || cookie.Value == "" {
		return false
	}

	payload, err := m.parseSession(cookie.Value)
	if err != nil {
		return false
	}

	return payload.ExpiresAt >= time.Now().Unix()
}

func (m *Manager) Login(w http.ResponseWriter, r *http.Request, password string) error {
	if !m.Configured() {
		return errors.New("password not configured")
	}

	if subtle.ConstantTimeCompare([]byte(password), []byte(m.Password)) != 1 {
		return ErrInvalidCredentials
	}

	return m.writeSessionCookie(w, r)
}

func (m *Manager) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     m.CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   isSecureRequest(r),
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
	})
}

func (m *Manager) Require(next http.HandlerFunc, onUnauthorized func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !m.AuthenticateRequest(r) {
			onUnauthorized(w, r)
			return
		}

		next(w, r)
	}
}

func (m *Manager) writeSessionCookie(w http.ResponseWriter, r *http.Request) error {
	now := time.Now()
	payload := sessionPayload{
		ExpiresAt: now.Add(m.SessionDuration).Unix(),
		IssuedAt:  now.Unix(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	encodedPayload := base64.RawURLEncoding.EncodeToString(body)
	signature := m.sign(encodedPayload)
	encodedSignature := base64.RawURLEncoding.EncodeToString(signature)

	http.SetCookie(w, &http.Cookie{
		Name:     m.CookieName,
		Value:    encodedPayload + "." + encodedSignature,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   isSecureRequest(r),
		Expires:  now.Add(m.SessionDuration),
		MaxAge:   int(m.SessionDuration.Seconds()),
	})

	return nil
}

func (m *Manager) parseSession(value string) (sessionPayload, error) {
	parts := strings.Split(value, ".")
	if len(parts) != 2 {
		return sessionPayload{}, errors.New("invalid session")
	}

	expected := m.sign(parts[0])
	signature, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return sessionPayload{}, err
	}

	if !hmac.Equal(expected, signature) {
		return sessionPayload{}, errors.New("invalid signature")
	}

	body, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return sessionPayload{}, err
	}

	var payload sessionPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		return sessionPayload{}, err
	}

	return payload, nil
}

func (m *Manager) sign(value string) []byte {
	mac := hmac.New(sha256.New, []byte(m.Password))
	mac.Write([]byte(value))
	return mac.Sum(nil)
}

func isSecureRequest(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}

	forwardedProto := strings.TrimSpace(strings.Split(r.Header.Get("X-Forwarded-Proto"), ",")[0])
	return strings.EqualFold(forwardedProto, "https")
}
