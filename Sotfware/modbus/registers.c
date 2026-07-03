#include "../incl/smartgreen.h"

double  calculate_salinity_ppm(int raw_value)
{
    double  x;

    x = (double)raw_value;
    return ((-1.06044991723606e-6 * pow(x, 3.0)) + (0.027993053 * pow(x, 2.0)) + (7.22299846 * x));
}

double  calculate_salinity_us(int raw_value)
{
    double  x;

    x = (double)raw_value;
    return ((3.7502257285455e-7 * pow(x, 3.0)) + (0.0501146383216609 * pow(x, 2.0)) + (13.1533305274848 * x));
}