import { render, screen } from "@testing-library/react";
// Imported via the `@/` alias to prove jest.config.ts moduleNameMapper resolves
// the same paths as tsconfig. A plain constant keeps this side-effect free.
import { ASSIGNMENT_STATUS_LABEL } from "@/types";

describe("test harness smoke", () => {
  it("renders with React Testing Library and jest-dom matchers", () => {
    render(<h1>Onnorokom test harness</h1>);
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
  });

  it("resolves the @/ path alias", () => {
    expect(ASSIGNMENT_STATUS_LABEL).toBeDefined();
  });
});
