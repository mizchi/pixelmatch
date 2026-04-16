#!/usr/bin/env python3
"""Fix MoonBit WASM codegen bug: Unit-returning wrapper functions leave extra values on stack.

The MoonBit compiler (as of 0.1.20260409) generates broken wrapper functions for
FixedArray.op_set and similar Unit-returning operations in the wasm target.
The wrapper calls an inner function that returns i32 (Unit as 0), then pushes
another i32.const 0, leaving 2 values on stack where only 1 is expected.

Fix: insert 'drop' after the call to discard the inner return before the final i32.const 0.
"""
import subprocess
import sys
import os

def fix_wasm(input_path, output_path):
    # Convert to WAT
    wat = subprocess.run(
        ["wasm-tools", "print", input_path],
        capture_output=True, text=True, check=True
    ).stdout

    lines = wat.split('\n')
    result = []
    fixed = 0

    i = 0
    while i < len(lines):
        stripped = lines[i].strip()

        # Detect the broken pattern:
        #   local.get 0
        #   local.get 1
        #   call N
        #   i32.const 0
        # )
        if (stripped.startswith('call ') and
            i + 1 < len(lines) and lines[i+1].strip() == 'i32.const 0' and
            i + 2 < len(lines) and lines[i+2].strip() == ')' and
            i >= 2 and lines[i-2].strip() == 'local.get 0' and
            lines[i-1].strip() == 'local.get 1'):
            # Verify the func header has (result i32) and (param i32 i32)
            func_line = lines[i-3].strip() if i >= 3 else ''
            if '(result i32)' in func_line and '(param i32 i32)' in func_line:
                result.append(lines[i])
                result.append('    drop')
                fixed += 1
                i += 1
                continue

        result.append(lines[i])
        i += 1

    if fixed == 0:
        print("No broken functions found - copying as-is")
        if input_path != output_path:
            import shutil
            shutil.copy2(input_path, output_path)
        return 0

    print(f"Fixed {fixed} broken wrapper function(s)")

    # Reassemble
    fixed_wat = '\n'.join(result)
    subprocess.run(
        ["wasm-tools", "parse", "-o", output_path],
        input=fixed_wat, text=True, check=True
    )

    # Validate
    subprocess.run(
        ["wasm-tools", "validate", output_path],
        check=True
    )
    print("Validation passed")
    return fixed

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <input.wasm> [output.wasm]")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else input_path

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        sys.exit(1)

    fix_wasm(input_path, output_path)
