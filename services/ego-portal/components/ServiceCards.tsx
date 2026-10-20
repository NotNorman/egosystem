import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ServiceProps {
  title: string;
  description: string;
  href: string;
  buttonText: string;
  titleColor: string;
  buttonColor: string;
  disabled: boolean;
}

const ServiceCards = (props: ServiceProps) => {
    return (
        <Card className={`bg-background border-border flex flex-col ${props.disabled ? 'opacity-50' : ''}`}>
          <CardHeader>
            <CardTitle className={`text-2xl ${props.titleColor}`}>
                {props.title}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {props.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto pt-6">
            {props.disabled ? (
              <Button disabled variant="secondary" className="w-full">
                {props.buttonText}
              </Button>
            ) : (
              <Link href={`${props.href}`} className="w-full">
                <Button className={`w-full ${props.buttonColor} hover:opacity-90 text-white cursor-pointer`}>
                  {props.buttonText}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
    );
}

export default ServiceCards;