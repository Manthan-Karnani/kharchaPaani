package com.kharchapaani;

import static com.kharchapaani.Models.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ExpenseController {
    private final ExpenseService service;
    public ExpenseController(ExpenseService service) { this.service = service; }

    @GetMapping("/categories")
    public List<Category> categories(@AuthenticationPrincipal AccountPrincipal user) { return service.categories(user.id()); }

    @GetMapping("/budgets/{month}")
    public Budget budget(@AuthenticationPrincipal AccountPrincipal user, @PathVariable String month) {
        return service.budget(user.id(), ExpenseService.parseMonth(month));
    }

    @PutMapping("/budgets/{month}")
    public Budget saveBudget(@AuthenticationPrincipal AccountPrincipal user, @PathVariable String month, @Valid @RequestBody BudgetInput input) {
        return service.saveBudget(user.id(), ExpenseService.parseMonth(month), input.amount());
    }

    @GetMapping("/dashboard")
    public Dashboard dashboard(@AuthenticationPrincipal AccountPrincipal user, @RequestParam String month) {
        return service.dashboard(user.id(), ExpenseService.parseMonth(month));
    }

    @GetMapping("/expenses")
    public List<Expense> expenses(@AuthenticationPrincipal AccountPrincipal user, @RequestParam String month) {
        return service.expenses(user.id(), ExpenseService.parseMonth(month));
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public Expense create(@AuthenticationPrincipal AccountPrincipal user, @Valid @RequestBody ExpenseInput input) {
        return service.create(user.id(), input);
    }

    @PutMapping("/expenses/{id}")
    public Expense update(@AuthenticationPrincipal AccountPrincipal user, @PathVariable long id, @Valid @RequestBody ExpenseInput input) {
        return service.update(user.id(), id, input);
    }

    @DeleteMapping("/expenses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AccountPrincipal user, @PathVariable long id) { service.delete(user.id(), id); }
}
