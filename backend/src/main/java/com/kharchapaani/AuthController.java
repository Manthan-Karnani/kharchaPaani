package com.kharchapaani;

import static com.kharchapaani.Models.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final ExpenseService service;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contexts;
    private final CsrfTokenRepository csrfTokens;

    public AuthController(ExpenseService service, AuthenticationManager authenticationManager,
                          SecurityContextRepository contexts, CsrfTokenRepository csrfTokens) {
        this.service = service;
        this.authenticationManager = authenticationManager;
        this.contexts = contexts;
        this.csrfTokens = csrfTokens;
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserView register(@Valid @RequestBody Credentials input) { return service.register(input); }

    @PostMapping("/login")
    public UserView login(@Valid @RequestBody Credentials input, HttpServletRequest request, HttpServletResponse response) {
        ExpenseService.validatePasswordBytes(input.password());
        var auth = authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(
            input.username().toLowerCase(Locale.ROOT), input.password()));
        new ChangeSessionIdAuthenticationStrategy().onAuthentication(auth, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        csrfTokens.saveToken(null, request, response);
        var user = (AccountPrincipal) auth.getPrincipal();
        return new UserView(user.id(), user.username());
    }

    @GetMapping("/me")
    public UserView me(@AuthenticationPrincipal AccountPrincipal user) { return new UserView(user.id(), user.username()); }
}
