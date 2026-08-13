import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssignmentSearchBar } from "@/components/search/AssignmentSearchBar";

function renderBar(overrides: Partial<Parameters<typeof AssignmentSearchBar>[0]> = {}) {
  const props = {
    searchText: "",
    status: "",
    onSearchTextChange: jest.fn(),
    onStatusChange: jest.fn(),
    onSubmit: jest.fn(),
    onReset: jest.fn(),
    ...overrides,
  };
  render(<AssignmentSearchBar {...props} />);
  return props;
}

describe("AssignmentSearchBar", () => {
  it("calls onSearchTextChange as the user types", async () => {
    const user = userEvent.setup();
    const props = renderBar();

    await user.type(screen.getByLabelText("Search"), "a");

    expect(props.onSearchTextChange).toHaveBeenCalledWith("a");
  });

  it("calls onStatusChange when a status is selected", async () => {
    const user = userEvent.setup();
    const props = renderBar();

    await user.selectOptions(screen.getByLabelText("Status"), "1");

    expect(props.onStatusChange).toHaveBeenCalledWith("1");
  });

  it("renders status options from ASSIGNMENT_STATUS_LABEL plus the default", () => {
    renderBar();

    const options = screen
      .getAllByRole("option")
      .map((o) => o.textContent);

    expect(options).toEqual(["All statuses", "Draft", "Published", "Closed"]);
  });

  it("submits via the Search button and prevents the default reload", async () => {
    const user = userEvent.setup();
    const props = renderBar();

    let submitEvent: Event | undefined;
    screen
      .getByRole("button", { name: "Search" })
      .closest("form")
      ?.addEventListener("submit", (e) => {
        submitEvent = e;
      });

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(submitEvent?.defaultPrevented).toBe(true);
  });

  it("calls onReset when the Reset button is clicked", async () => {
    const user = userEvent.setup();
    const props = renderBar();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(props.onReset).toHaveBeenCalledTimes(1);
  });
});
