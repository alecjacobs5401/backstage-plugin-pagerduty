/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// eslint-disable-next-line @backstage/no-undeclared-imports
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { EscalationPolicy } from "./EscalationPolicy";
import { TestApiRegistry, wrapInTestApp } from "@backstage/test-utils";
import { PagerDutyUser } from "@pagerduty/backstage-plugin-common";
import { pagerDutyApiRef } from "../../api";
import { ApiProvider } from "@backstage/core-app-api";

const mockPagerDutyApi = {
  getOnCallByPolicyId: jest.fn(),
};
const apis = TestApiRegistry.from([pagerDutyApiRef, mockPagerDutyApi]);

describe("Escalation", () => {
  it("Handles an empty response", async () => {
    mockPagerDutyApi.getOnCallByPolicyId = jest
      .fn()
      .mockImplementationOnce(async () => ({ oncalls: [] }));

    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <EscalationPolicy policyId="456" />
        </ApiProvider>
      )
    );
    await waitFor(() => !queryByTestId("progress"));

    expect(getByText("No one is on-call. Update the escalation policy.")).toBeInTheDocument();
    expect(mockPagerDutyApi.getOnCallByPolicyId).toHaveBeenCalledWith("456");
  });

  it("Renders a forbidden state when change events is undefined", async () => {
    mockPagerDutyApi.getOnCallByPolicyId = jest
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error(
          "Forbidden: You are not allowed to perform this action"
        );
      });

    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <EscalationPolicy policyId="abc" />
        </ApiProvider>
      )
    );
    await waitFor(() => !queryByTestId("progress"));
    expect(
      getByText(
        "You don't permissions to list on-calls. Check your OAuth token permissions."
      )
    ).toBeInTheDocument();
  });

  it("Render a list of users", async () => {
    mockPagerDutyApi.getOnCallByPolicyId = jest
      .fn()
      .mockImplementationOnce(async () => (
        [
          {
              name: "person1",
              id: "p1",
              summary: "person1",
              email: "person1@example.com",
              html_url: "http://a.com/id1",
          },
        ] as PagerDutyUser[]
      ));

    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <EscalationPolicy policyId="abc" />
        </ApiProvider>
      )
    );
    await waitFor(() => !queryByTestId("progress"));

    expect(getByText("person1")).toBeInTheDocument();
    expect(getByText("person1@example.com")).toBeInTheDocument();
    expect(mockPagerDutyApi.getOnCallByPolicyId).toHaveBeenCalledWith("abc");
  });

  it("Renders a user with profile picture", async () => {
    mockPagerDutyApi.getOnCallByPolicyId = jest
      .fn()
      .mockImplementationOnce(async () => (
        [
          {
            name: "person1",
            id: "p1",
            summary: "person1",
            email: "person1@example.com",
            html_url: "http://a.com/id1",
            avatar_url:
              "https://gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?f=y",
          },
        ] as PagerDutyUser[]
      ));

    const { getByText, queryByTestId, getByAltText } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <EscalationPolicy policyId="abc" />
        </ApiProvider>
      )
    );
    await waitFor(() => !queryByTestId("progress"));

    expect(getByText("person1")).toBeInTheDocument();
    expect(getByText("person1@example.com")).toBeInTheDocument();
    expect(getByAltText("User")).toHaveAttribute(
      "src",
      "https://gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?f=y"
    );
    expect(mockPagerDutyApi.getOnCallByPolicyId).toHaveBeenCalledWith("abc");
  });

  it("Handles errors", async () => {
    mockPagerDutyApi.getOnCallByPolicyId = jest
      .fn()
      .mockRejectedValueOnce(new Error("Error message"));

    const { getByText, queryByTestId } = render(
      wrapInTestApp(
        <ApiProvider apis={apis}>
          <EscalationPolicy policyId="abc" />
        </ApiProvider>
      )
    );
    await waitFor(() => !queryByTestId("progress"));

    expect(
      getByText("Error encountered while fetching information. Error message")
    ).toBeInTheDocument();
  });
});
