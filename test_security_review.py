from backend.app.services.terraform_validation_service import _security_review


test_cases = {
    "Public SSH": {
        "code": """
        ingress {
            from_port   = 22
            to_port     = 22
            cidr_blocks = ["0.0.0.0/0"]
        }
        """,
        "expected_high": "Public SSH access detected",
    },

    "Public RDP": {
        "code": """
        ingress {
            from_port   = 3389
            to_port     = 3389
            cidr_blocks = ["0.0.0.0/0"]
        }
        """,
        "expected_high": "Public RDP access detected",
    },

    "Restricted SSH": {
        "code": """
        ingress {
            from_port   = 22
            to_port     = 22
            cidr_blocks = ["192.168.1.10/32"]
        }
        """,
        "expected_high": None,
    },

    "Restricted RDP": {
        "code": """
        ingress {
            from_port   = 3389
            to_port     = 3389
            cidr_blocks = ["192.168.1.10/32"]
        }
        """,
        "expected_high": None,
    },

    "Separate Public HTTP and Restricted SSH": {
        "code": """
        ingress {
            from_port   = 80
            to_port     = 80
            cidr_blocks = ["0.0.0.0/0"]
        }

        ingress {
            from_port   = 22
            to_port     = 22
            cidr_blocks = ["192.168.1.10/32"]
        }
        """,
        "expected_high": None,
    },
}


total_tests = len(test_cases)
passed_tests = 0

for test_name, test_data in test_cases.items():

    terraform_code = test_data["code"]
    expected_high = test_data["expected_high"]

    findings = _security_review(terraform_code)

    high_findings = [
        finding["title"]
        for finding in findings
        if finding["severity"] == "HIGH"
    ]

    if expected_high is None:
        test_passed = len(high_findings) == 0
    else:
        test_passed = expected_high in high_findings

    print("\n" + "=" * 60)
    print(f"TEST: {test_name}")
    print("=" * 60)

    for finding in findings:
        print(
            f"[{finding['severity']}] "
            f"{finding['title']}"
        )

    if test_passed:
        print("RESULT: PASS")
        passed_tests += 1
    else:
        print("RESULT: FAIL")
        print(f"Expected HIGH finding: {expected_high}")
        print(f"Actual HIGH findings: {high_findings}")


print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)

print(f"Total tests : {total_tests}")
print(f"Passed     : {passed_tests}")
print(f"Failed    : {total_tests - passed_tests}")

if passed_tests == total_tests:
    print("ALL TESTS PASSED!")
else:
    print("SOME TESTS FAILED!")