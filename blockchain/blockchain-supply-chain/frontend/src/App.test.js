import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App Component", () => {
  beforeEach(() => {
    render(<App />);
  });

  test("renders Blockchain Product Verification header", () => {
    expect(screen.getByText(/Blockchain Product Verification/i)).toBeInTheDocument();
  });

  test("renders Register Product section", () => {
    expect(screen.getByText(/Register Product/i)).toBeInTheDocument();
  });

  test("renders Verify Product section", () => {
    expect(screen.getByText(/Verify Product/i)).toBeInTheDocument();
  });

  test("renders Update Product Status section", () => {
    expect(screen.getByText(/Update Product Status/i)).toBeInTheDocument();
  });
});
