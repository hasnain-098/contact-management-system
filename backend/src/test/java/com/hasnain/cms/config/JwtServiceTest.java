package com.hasnain.cms.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    private static final String TEST_SECRET = "012345678901234567890123456789012345678901234567890123456789ABCD";
    private static final long TEST_EXPIRATION_MS = 3600000; // 1 hour

    private UserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        ReflectionTestUtils.setField(jwtService, "secretKey", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "expirationMs", TEST_EXPIRATION_MS);

        testUserDetails = mock(UserDetails.class);
        when(testUserDetails.getUsername()).thenReturn("test@user.com");
    }

    @Test
    void generateToken_success_withNoExtraClaims() {
        String token = jwtService.generateToken(testUserDetails);

        assertNotNull(token);
        assertFalse(token.isEmpty());

        String username = jwtService.extractUsername(token);
        assertEquals("test@user.com", username);
    }

    @Test
    void generateToken_success_withExtraClaims() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "ADMIN");
        extraClaims.put("id", 42);

        String token = jwtService.generateToken(extraClaims, testUserDetails);

        assertNotNull(token);

        Claims claims = jwtService.extractAllClaims(token);
        assertEquals("ADMIN", claims.get("role"));
        assertEquals(42, claims.get("id"));
        assertEquals("test@user.com", claims.getSubject());
    }

    @Test
    void isTokenValid_success_nonExpiredToken() {
        String token = jwtService.generateToken(testUserDetails);

        assertTrue(jwtService.isTokenValid(token, testUserDetails));
    }

    @Test
    void isTokenValid_failure_expiredToken() throws Exception {
        Map<String, Object> extraClaims = new HashMap<>();
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                "testUser", "password", new ArrayList<>());

        String base64Key = "c2VjdXJldGVzdGtleXNlY3VyZXRlc3RrZXlzZWN1cmV0ZXN0a2V5MTIzNA==";

        Field secretKeyField = JwtService.class.getDeclaredField("secretKey");
        secretKeyField.setAccessible(true);
        secretKeyField.set(jwtService, base64Key);

        Field expirationField = JwtService.class.getDeclaredField("expirationMs");
        expirationField.setAccessible(true);
        expirationField.set(jwtService, 3600000L);

        String expiredToken = Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis() - 3600000))
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Key)))
                .compact();

        assertThrows(io.jsonwebtoken.ExpiredJwtException.class, () ->
            jwtService.isTokenValid(expiredToken, userDetails)
        );
    }




    @Test
    void isTokenValid_failure_wrongUser() {
        String token = jwtService.generateToken(testUserDetails);

        UserDetails wrongUser = mock(UserDetails.class);
        when(wrongUser.getUsername()).thenReturn("wrong@user.com");

        assertFalse(jwtService.isTokenValid(token, wrongUser));
    }

    @Test
    void isTokenValid_failure_invalidSignature() {
        String wrongSecret = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        SecretKey wrongKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(wrongSecret));

        String tamperedToken = Jwts.builder()
                .subject("test@user.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + TEST_EXPIRATION_MS))
                .signWith(wrongKey)
                .compact();

        assertThrows(io.jsonwebtoken.security.SignatureException.class,
                () -> jwtService.isTokenValid(tamperedToken, testUserDetails),
                "Validation should throw SignatureException for tampered token.");
    }

    @Test
    void extractUsername_success() {
        String token = jwtService.generateToken(testUserDetails);
        assertEquals("test@user.com", jwtService.extractUsername(token));
    }

    @Test
    void extractExpiration_success() {
        String token = jwtService.generateToken(testUserDetails);
        Date expiration = jwtService.extractExpiration(token);

        long expirationTime = expiration.getTime();
        long expectedTime = System.currentTimeMillis() + TEST_EXPIRATION_MS;

        assertTrue(expirationTime > expectedTime - 5000);
        assertTrue(expirationTime < expectedTime + 5000);
    }
}