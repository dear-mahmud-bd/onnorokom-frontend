import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchPagination } from "@/components/search/SearchPagination";

function prevButton() {
  return screen.getByRole("button", { name: "Previous" });
}
function nextButton() {
  return screen.getByRole("button", { name: "Next" });
}

describe("SearchPagination", () => {
  it("disables Previous on the first page and enables Next when more remain", () => {
    render(
      <SearchPagination
        take={10}
        skip={0}
        hitCount={10}
        totalMatches={25}
        onPageChange={jest.fn()}
      />,
    );

    expect(prevButton()).toBeDisabled();
    expect(nextButton()).toBeEnabled();
  });

  it("disables Next on the last page and enables Previous", () => {
    render(
      <SearchPagination
        take={10}
        skip={20}
        hitCount={5}
        totalMatches={25}
        onPageChange={jest.fn()}
      />,
    );

    expect(nextButton()).toBeDisabled();
    expect(prevButton()).toBeEnabled();
  });

  it("renders the showing X–Y of N range for a mid-list page", () => {
    render(
      <SearchPagination
        take={10}
        skip={10}
        hitCount={10}
        totalMatches={25}
        onPageChange={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Showing 11–20 of 25",
      ),
    ).toBeInTheDocument();
  });

  it("shows a 0–0 of 0 range when there are no matches", () => {
    render(
      <SearchPagination
        take={10}
        skip={0}
        hitCount={0}
        totalMatches={0}
        onPageChange={jest.fn()}
      />,
    );

    expect(
      screen.getByText(
        (_, element) => element?.textContent === "Showing 0–0 of 0",
      ),
    ).toBeInTheDocument();
  });

  it("calls onPageChange with the next offset when Next is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <SearchPagination
        take={10}
        skip={10}
        hitCount={10}
        totalMatches={25}
        onPageChange={onPageChange}
      />,
    );

    await user.click(nextButton());
    expect(onPageChange).toHaveBeenCalledWith(20);
  });

  it("calls onPageChange with the previous offset, clamped at zero", async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();
    render(
      <SearchPagination
        take={10}
        skip={5}
        hitCount={5}
        totalMatches={25}
        onPageChange={onPageChange}
      />,
    );

    await user.click(prevButton());
    expect(onPageChange).toHaveBeenCalledWith(0);
  });
});
