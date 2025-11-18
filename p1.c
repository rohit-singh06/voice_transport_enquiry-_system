#include <stdio.h>
#include <stdbool.h>
#define RESOURCES 3
struct process
{
    int max[RESOURCES];
    int allocated[RESOURCES];
    int need[RESOURCES];
} ps[1000];
int main()
{
    int n;
    printf("Enter number of processes:");
    scanf("%d", &n);
    printf("Enter maximum requirement:\n");
    for (int i = 0; i < n; i++)
        for (int j = 0; j < RESOURCES; j++)
            scanf("%d", &ps[i].max[j]);
    printf("Enter allocated matrix:\n");
    for (int i = 0; i < n; i++)
        for (int j = 0; j < RESOURCES; j++)
            scanf("%d", &ps[i].allocated[j]);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < RESOURCES; j++)
            ps[i].need[j] = ps[i].max[j] - ps[i].allocated[j];
    int available[RESOURCES];
    printf("Resource Vector:");
    for (int i = 0; i < RESOURCES; i++)
        scanf("%d", &available[i]);
    printf("\nSafe Sequence:");
    int completed = 0;
    bool is_completed[n];
    for (int i = 0; i < n; i++)
        is_completed[i] = false;
    while (completed != n)
    {
        bool dead = false;
        for (int i = 0; i < n; i++)
        {
            if (!is_completed[i])
            {
                bool sufficient = true;
                for (int j = 0; j < RESOURCES; j++)
                {
                    if (available[j] < ps[i].need[j])
                    {
                        sufficient = false;
                        break;
                    }
                }
                if (sufficient)
                {
                    completed++;
                    is_completed[i] = true;
                    for (int j = 0; j < RESOURCES; j++)
                        available[j] += ps[i].allocated[j];
                    printf("P%d ", i);
                    dead = true;
                }
            }
        }
        if (!dead)
        {
            printf("\nDeadlock detected!");
            return 0;
        }
    }
    return 0;
}