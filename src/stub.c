#include <moonbit.h>
#include <string.h>

// Compare two int32 array rows for equality.
// a, b: FixedArray[Int] pointers (int32_t*)
// offset: start index (in int32 elements)
// len: number of int32 elements to compare
// Returns 1 if equal, 0 if different.
int32_t c_row_equal(int32_t *a, int32_t *b, int32_t offset, int32_t len) {
    return memcmp(a + offset, b + offset, (size_t)len * sizeof(int32_t)) == 0 ? 1 : 0;
}

// Compute YIQ color delta for one pixel (4 consecutive int32 values: R,G,B,A).
// Returns delta * 1000000 as int32 to avoid float marshalling overhead.
// For comparison with threshold, caller multiplies threshold the same way.
//
// Actually, let's just do the full row comparison in C for maximum speed.
// Process a row of pixels and return number of differing pixels.
int32_t c_row_diff_count(int32_t *data1, int32_t *data2,
                         int32_t row_start, int32_t width,
                         double max_delta) {
    int32_t diff = 0;
    int32_t end = row_start + width * 4;

    for (int32_t base = row_start; base < end; base += 4) {
        int32_t r1 = data1[base];
        int32_t g1 = data1[base + 1];
        int32_t b1 = data1[base + 2];
        int32_t a1 = data1[base + 3];
        int32_t r2 = data2[base];
        int32_t g2 = data2[base + 1];
        int32_t b2 = data2[base + 2];
        int32_t a2 = data2[base + 3];

        double rf1, gf1, bf1, rf2, gf2, bf2;
        if (a1 == a2 && a1 == 255) {
            rf1 = (double)r1; gf1 = (double)g1; bf1 = (double)b1;
            rf2 = (double)r2; gf2 = (double)g2; bf2 = (double)b2;
        } else {
            double alpha1 = (double)a1 / 255.0;
            double white1 = 255.0 * (1.0 - alpha1);
            double alpha2 = (double)a2 / 255.0;
            double white2 = 255.0 * (1.0 - alpha2);
            rf1 = (double)r1 * alpha1 + white1;
            gf1 = (double)g1 * alpha1 + white1;
            bf1 = (double)b1 * alpha1 + white1;
            rf2 = (double)r2 * alpha2 + white2;
            gf2 = (double)g2 * alpha2 + white2;
            bf2 = (double)b2 * alpha2 + white2;
        }

        double dr = rf1 - rf2;
        double dg = gf1 - gf2;
        double db = bf1 - bf2;

        double y = 0.29889531 * dr + 0.58662247 * dg + 0.11448223 * db;
        double i = 0.59597799 * dr - 0.27417610 * dg - 0.32180189 * db;
        double q = 0.21147017 * dr - 0.52261711 * dg + 0.31114694 * db;

        double delta = 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
        if (delta > max_delta) {
            diff++;
        }
    }
    return diff;
}
