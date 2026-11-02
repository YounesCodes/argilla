import { mount } from "@vue/test-utils";
import ReviewTextSize from "./ReviewTextSize.vue";

const create = () => mount(ReviewTextSize, { mocks: { $t: (key) => key } });

describe("Review text size preference", () => {
  beforeEach(() => localStorage.clear());

  it("saves the selected size and restores it on a later visit", async () => {
    const wrapper = create();
    await wrapper.find("select").setValue("20");
    expect(wrapper.emitted("input")).toEqual([[20]]);
    expect(localStorage.getItem("argilla.review-text-size")).toBe("20");
    wrapper.destroy();
    const nextVisit = create();
    expect(nextVisit.emitted("input")).toEqual([[20]]);
    nextVisit.destroy();
  });

  it.each(["999", "invalid", "", "-10"])(
    "ignores invalid saved size %s",
    (value) => {
      localStorage.setItem("argilla.review-text-size", value);
      const wrapper = create();
      expect(wrapper.emitted("input")).toBeUndefined();
      expect(wrapper.find("select").element.value).toBe("16");
      wrapper.destroy();
    }
  );

  it("works when local storage is blocked", async () => {
    const get = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });
    const set = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage blocked");
      });
    const wrapper = create();
    await wrapper.find("select").setValue("24");
    expect(wrapper.emitted("input")).toEqual([[24]]);
    wrapper.destroy();
    get.mockRestore();
    set.mockRestore();
  });
});
